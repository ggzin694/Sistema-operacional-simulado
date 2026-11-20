# Mint OS Desktop

Uma simulacao interativa de desktop inspirada no Linux Mint e no Cinnamon. Ela roda no navegador durante o desenvolvimento e pode ser empacotada como um aplicativo portatil `.exe` para Windows usando Electron.

## Iniciar no navegador

```bash
npm install
npm run dev
```

## Gerar o iniciador para Windows

Em um computador Windows com Node.js e npm instalados, execute `launcher/Build Mint OS for Windows.bat`. O arquivo portatil sera criado em `release/MintOS-0.0.0-x64-portable.exe`. Depois, basta abrir o `.exe` ou usar `launcher/Start Mint OS.bat`.

Tambem e possivel gerar pelo terminal:

```bash
npm run build
npx electron-builder --win portable --x64 --config electron-builder.yml
```

O aplicativo inclui area de trabalho, menu Mint, janelas arrastaveis, arquivos, navegador demonstrativo, terminal local, notas com salvamento local, calculadora e configuracoes de aparencia/rede.

> Este projeto e uma simulacao de interface, nao uma distribuicao Linux nem um sistema operacional inicializavel. O `.exe` abre o desktop em uma janela do aplicativo e nao substitui o Windows nem altera particoes.