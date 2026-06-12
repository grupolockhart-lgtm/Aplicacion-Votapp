

param(
    [string]$accion = "abrir"  # opciones: abrir o cerrar
)

if ($accion -eq "abrir") {
    Write-Host "Abriendo puerto 8000..."
    try {
        New-NetFirewallRule -DisplayName "Puerto 8000 Votapp" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -ErrorAction Stop
        Write-Host "Puerto 8000 abierto correctamente."
    }
    catch {
        Write-Host "❌ Error: No se pudo abrir el puerto. Ejecuta PowerShell como administrador."
    }
}
elseif ($accion -eq "cerrar") {
    Write-Host "Cerrando puerto 8000..."
    try {
        Get-NetFirewallRule -DisplayName "Puerto 8000 Votapp" | Remove-NetFirewallRule -ErrorAction Stop
        Write-Host "Puerto 8000 cerrado correctamente."
    }
    catch {
        Write-Host "❌ Error: No se pudo cerrar el puerto. Ejecuta PowerShell como administrador."
    }
}
else {
    Write-Host "Opción inválida. Usa 'abrir' o 'cerrar'."
}


