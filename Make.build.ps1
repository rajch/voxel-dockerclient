Param(
    [string] $VersionMajor = (property VERSION_MAJOR "0"),
    [string] $VersionMinor = (property VERSION_MINOR "4"),
    [string] $BuildNumber  = (property BUILD_NUMBER  "2"),
    [string] $PatchString  = (property PATCH_NUMBER  "-patchws"),
    [string] $RegistryUser = (property REGISTRY_USER "rajchaudhuri")
)

# Maintain semantic version in the parameters above
# and for now manually update the deployment files:
#	docker-compose.yml, stack.yml and package.json
$VersionString = "$($VersionMajor).$($VersionMinor).$($BuildNumber)$($PatchString)"

$ServerBinary = "voxel-dockerclient"
If ($env:GOOS -eq "windows") {
    $ServerBinary += ".exe"
}

# Synopsis: Show usage
task . {
    Write-Host "Usage:"
    Write-Host "Invoke-Build server|client|client-debug|debug|all|clean|image|run-image|clean-image"
}

# Synopsis: Build output directory
task outputdir -Outputs out\ {
    New-Item -Path out\ -ItemType Directory -ErrorAction Ignore
}

# Synopsis: Build HTML, CSS and static javascript files
task public outputdir, {
    exec {
        npm run build-public
    }
}

# Synopsis: Build main client javascript file
task client -Outputs out/js/client.js -Inputs (Get-Item client/*.js) public, {
    exec {
        npm run build-client-release
    }
}

# Synopsis: Build debuggable main client javascript file
task client-debug -Outputs out/js/client.js -Inputs (Get-Item client/*.js) public, {
    exec {
        npm run build-client-debug
    }
}

# Synopsis: Build server
task server -Outputs out/${ServerBinary} -Inputs (Get-Item server/*.go) outputdir, {
    exec {
        $env:CGO_ENABLED = "0"
        # $env:GOOS="windows"
        # $env:GOARCH="amd64"
        go build -o ${Outputs} -ldflags "-X 'main.version=${VersionString}'" ./server
    }
}

# Synopsis: Build server and debuggable client
task debug client-debug, server

# Synopsis: Build server and release-mode client
task all client, server

# Synopsis: Clean output directory
task clean {
    Remove-Item -Recurse -Force -ErrorAction Ignore ./out
}

# Synopsis: Build container image
task image {
    exec {
        docker image build -t ${RegistryUser}/voxel-dockerclient:${VersionString} -f Dockerfile --build-arg VERSION_STRING=${VersionString} .
    }
}

# Synopsis: Build container image, and run disposable container
task run-image image, {
    exec {
        docker container run --rm --mount "type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock" --publish 8080:8080 ${RegistryUser}/voxel-dockerclient:${VersionString}
    }
}

# Synopsis: Delete container image
task clean-image {
    exec {
        docker image rm ${RegistryUser}/voxel-dockerclient:${VersionString}
    }
}