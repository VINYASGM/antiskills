$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
node "$scriptPath\bin\veyra.js" $args
