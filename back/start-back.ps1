$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Error "Arquivo .env nao encontrado em $PSScriptRoot"
    exit 1
}

foreach ($rawLine in Get-Content $envFile) {
    $line = $rawLine.Trim().TrimStart([char]0xFEFF)
    if ($line -eq "" -or $line.StartsWith("#")) {
        continue
    }

    $parts = $line.Split("=", 2)
    if ($parts.Count -eq 2) {
        [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
    }
}

if ([string]::IsNullOrWhiteSpace($env:DB_URL)) {
    Write-Error "DB_URL nao foi carregada do arquivo .env"
    exit 1
}

Write-Output "Usando DB_URL=$env:DB_URL"
Write-Output "Iniciando backend via Maven (spring-boot:run)..."

$runArgs = @(
  "--spring.datasource.url=$env:DB_URL"
  "--spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver"
  "--spring.datasource.username=$env:DB_USER"
  "--spring.datasource.password=$env:DB_PASSWORD"
  "--mercado_pago_sample_access_token=$env:MP_TOKEN"
  "--spring.mail.username=$env:MAIL_USER"
  "--spring.mail.password=$env:MAIL_PASSWORD"
) -join " "

mvn spring-boot:run "-Dspring-boot.run.arguments=$runArgs"
