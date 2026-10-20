@echo off
chcp 65001 > nul
echo ========================================================
echo   ENVIANDO PROJETO SIMULA QDC PARA O GITHUB...
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/5] Inicializando Git...
git init

echo [2/5] Adicionando arquivos...
git add .

echo [3/5] Criando commit...
git commit -m "feat: Forca modo claro v8.1, correcao de contraste e cache busting Vercel"

echo [4/5] Configurando branch main...
git branch -M main

echo [5/5] Vinculando repositorio remoto...
git remote remove origin 2>nul
git remote add origin https://github.com/Alisson-devs/simula-qdc.git

echo.
echo Enviando para https://github.com/Alisson-devs/simula-qdc.git...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCESSO! Arquivos enviados com sucesso para o GitHub!
    echo   Agora volte para a Vercel e clique em Deploy.
    echo ========================================================
) else (
    echo ========================================================
    echo   ATENCAO: Se solicitou login, faca a autorizacao na janela
    echo   do navegador que se abriu para concluir o envio.
    echo ========================================================
)

echo.
pause
