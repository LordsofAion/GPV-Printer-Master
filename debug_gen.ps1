
$Secret = "GPV_MASTER_LICENSE_KEY_2026_SECURE_HASH_XY99"
$Header = '{"alg":"HS256","typ":"JWT"}'
$Payload = '{"client":"Usuario Master","expiry":"2036-01-01T00:00:00.000Z"}'

function b64u($s) {
    if ($s -is [string]) {
        $b = [System.Text.Encoding]::UTF8.GetBytes($s)
    }
    else {
        $b = $s
    }
    return [Convert]::ToBase64String($b).Split('=')[0].Replace('+', '-').Replace('/', '_')
}

$eh = b64u $Header
$ep = b64u $Payload
$src = "$eh.$ep"

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($Secret)
$sigBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($src))
$sig = b64u $sigBytes

$jwt = "$eh.$ep.$sig"
Write-Output "RESULT_JWT:$jwt"
[System.IO.File]::WriteAllText("d:\TRABALHO PARA ESSE ANO 2026\gpv-print-manager\final_activation_key.txt", $jwt)
