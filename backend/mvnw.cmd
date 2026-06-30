@echo off
setlocal

set "DIR=%~dp0"
set "WRAPPER_PROPERTIES=%DIR%.mvn\wrapper\maven-wrapper.properties"
set "BASE_DIR=%DIR%.mvn\wrapper"
set "ZIP_PATH=%BASE_DIR%\apache-maven-3.9.9-bin.zip"
set "EXTRACT_DIR=%BASE_DIR%\maven"

if not exist "%EXTRACT_DIR%" (
    echo Downloading Maven 3.9.9...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
        Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip' -OutFile '%ZIP_PATH%' -UseBasicParsing; ^
        Expand-Archive -Path '%ZIP_PATH%' -DestinationPath '%EXTRACT_DIR%' -Force; ^
        Remove-Item '%ZIP_PATH%'"
)

@rem Find the mvn.cmd inside the extracted folder
for /f "delims=" %%i in ('dir /b /s "%EXTRACT_DIR%\mvn.cmd"') do (
    set "MVN_EXE=%%i"
    goto run
)

:run
if "%MVN_EXE%"=="" (
    echo Error: Could not find mvn.cmd in %EXTRACT_DIR%
    exit /b 1
)

"%MVN_EXE%" %*
