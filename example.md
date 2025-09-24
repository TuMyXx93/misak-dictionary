# ═══════════════════════════════════════════════════════════════════════════════════════

# 🚀 ZSHRC CONFIGURATION - Configuración Profesional de Shell

# ═══════════════════════════════════════════════════════════════════════════════════════

# Archivo de configuración optimizado para desarrollo moderno con Node.js y pnpm

# Professional shell configuration optimized for modern development workflows

# ═══════════════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════

# 💫 POWERLEVEL10K INSTANT PROMPT - Carga Inmediata del Tema

# ═══════════════════════════════════════════════════════════════════════

# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.

# Initialization code that may require console input (password prompts, [y/n]

# confirmations, etc.) must go above this block; everything else may go below.

if [[-r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"]]; then
source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# ═══════════════════════════════════════════════════════════════════════

# 🛤️ PATH CONFIGURATION - Configuración de Rutas del Sistema

# ═══════════════════════════════════════════════════════════════════════

# If you come from bash you might have to change your $PATH.

# export PATH=$HOME/bin:$HOME/.local/bin:/usr/local/bin:$PATH

# ═══════════════════════════════════════════════════════════════════════

# 🎨 OH MY ZSH CONFIGURATION - Configuración del Framework ZSH

# ═══════════════════════════════════════════════════════════════════════

# Path to your Oh My Zsh installation.

export ZSH="$HOME/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will

# load a random theme each time Oh My Zsh is loaded, in which case,

# to know which specific one was loaded, run: echo $RANDOM_THEME

# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes

ZSH_THEME="powerlevel10k/powerlevel10k"

# Set list of themes to pick from when loading at random

# Setting this variable when ZSH_THEME=random will cause zsh to load

# a theme from this variable instead of looking in $ZSH/themes/

# If set to an empty array, this variable will have no effect.

# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# ═══════════════════════════════════════════════════════════════════════

# ⚙️ SHELL BEHAVIOR - Comportamiento y Configuración del Shell

# ═══════════════════════════════════════════════════════════════════════

# Uncomment the following line to use case-sensitive completion.

# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.

# Case-sensitive completion must be off. \_ and - will be interchangeable.

# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior

# zstyle ':omz:update' mode disabled # disable automatic updates

# zstyle ':omz:update' mode auto # update automatically without asking

# zstyle ':omz:update' mode reminder # just remind me to update when it's time

# Uncomment the following line to change how often to auto-update (in days).

# zstyle ':omz:update' frequency 13

# Uncomment the following line if pasting URLs and other text is messed up.

# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.

# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.

# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.

# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.

# You can also set it to another string to have that shown instead of the default red dots.

# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"

# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)

# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files

# under VCS as dirty. This makes repository status check for large repositories

# much, much faster.

# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time

# stamp shown in the history command output.

# You can set one of the optional three formats:

# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"

# or set a custom format using the strftime function format specifications,

# see 'man strftime' for details.

# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?

# ZSH_CUSTOM=/path/to/new-custom-folder

# ═══════════════════════════════════════════════════════════════════════

# 🔌 PLUGINS CONFIGURATION - Configuración de Plugins

# ═══════════════════════════════════════════════════════════════════════

# Which plugins would you like to load?

# Standard plugins can be found in $ZSH/plugins/

# Custom plugins may be added to $ZSH_CUSTOM/plugins/

# Example format: plugins=(rails git textmate ruby lighthouse)

# Add wisely, as too many plugins slow down shell startup.

plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh

# ═══════════════════════════════════════════════════════════════════════

# 🌐 USER ENVIRONMENT - Configuración del Entorno de Usuario

# ═══════════════════════════════════════════════════════════════════════

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment

# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions

# if [[-n $SSH_CONNECTION]]; then

# export EDITOR='vim'

# else

# export EDITOR='nvim'

# fi

# Compilation flags

# export ARCHFLAGS="-arch $(uname -m)"

# ═══════════════════════════════════════════════════════════════════════

# 🔧 BASIC SYSTEM ALIASES - Aliases Básicos del Sistema

# ═══════════════════════════════════════════════════════════════════════

# Set personal aliases, overriding those provided by Oh My Zsh libs,

# plugins, and themes. Aliases can be placed here, though Oh My Zsh

# users are encouraged to define aliases within a top-level file in

# the $ZSH_CUSTOM folder, with .zsh extension. Examples:

# - $ZSH_CUSTOM/aliases.zsh

# - $ZSH_CUSTOM/macos.zsh

# For a full list of active aliases, run `alias`.

#

# Example aliases

# alias zshconfig="mate ~/.zshrc"

# alias ohmyzsh="mate ~/.oh-my-zsh"

alias cl="clear"
alias update='sudo apt update && sudo apt upgrade -y'

# ═══════════════════════════════════════════════════════════════════════

# 🎭 THEME CONFIGURATION - Configuración del Tema Powerlevel10k

# ═══════════════════════════════════════════════════════════════════════

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.

[[! -f ~/.p10k.zsh]] || source ~/.p10k.zsh

# ═══════════════════════════════════════════════════════════════════════

# 📦 NODE.JS ENVIRONMENT - Entorno Node.js y Gestores de Versiones

# ═══════════════════════════════════════════════════════════════════════

# NVM Configuration - This MUST come after Homebrew to override Node.js

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion

# Use the default Node.js version set by nvm

if [ -s "$NVM_DIR/nvm.sh" ]; then
nvm use default --silent
fi

# ═══════════════════════════════════════════════════════════════════════

# 🍺 HOMEBREW CONFIGURATION - Configuración de Homebrew

# ═══════════════════════════════════════════════════════════════════════

# Initialize Homebrew first (but NVM will override Node.js)

eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

# ═══════════════════════════════════════════════════════════════════════

# 🏃 RUNTIME ENVIRONMENTS - Entornos de Ejecución Alternativos

# ═══════════════════════════════════════════════════════════════════════

# bun completions

[ -s "/home/tumidev/.local/share/reflex/bun/_bun" ] && source "/home/tumidev/.local/share/reflex/bun/\_bun"

# bun

export BUN_INSTALL="$HOME/.local/share/reflex/bun"
export PATH="$BUN_INSTALL/bin:$PATH"

. "$HOME/.local/bin/env"

# ═══════════════════════════════════════════════════════════════════════

# 🅰️ ANGULAR CLI - Configuración de Angular Framework

# ═══════════════════════════════════════════════════════════════════════

# Load Angular CLI autocompletion.

source <(ng completion script)

# ═══════════════════════════════════════════════════════════════════════

# 🐍 PYTHON DEVELOPMENT - Configuración de Desarrollo Python

# ═══════════════════════════════════════════════════════════════════════

# Use system Python instead of Homebrew Python for development

alias python="/usr/bin/python3"
alias python3="/usr/bin/python3"
alias pip="/usr/bin/python3 -m pip"
alias pip3="/usr/bin/python3 -m pip"

# ═══════════════════════════════════════════════════════════════════════

# 🐳 DOCKER & DATABASE TOOLS - Herramientas Docker y Bases de Datos

# ═══════════════════════════════════════════════════════════════════════

# Development tools aliases for your dictionary project

alias dc="docker compose"
alias dcu="docker compose up"
alias dcd="docker compose down"
alias dcl="docker compose logs"
alias dps="docker ps"
alias redis-cli="/home/linuxbrew/.linuxbrew/bin/redis-cli"
alias pg_dump="/home/linuxbrew/.linuxbrew/opt/postgresql@15/bin/pg_dump"
alias psql-brew="/home/linuxbrew/.linuxbrew/opt/postgresql@15/bin/psql"

# ═══════════════════════════════════════════════════════════════════════

# 📦 PACKAGE MANAGER MIGRATION - Migración de Gestores de Paquetes

# ═══════════════════════════════════════════════════════════════════════

# DEPRECATED npm aliases - pnpm is now the standard for new projects

# These aliases are kept for legacy project compatibility only

# Legacy npm commands (use pnpm for new projects)

alias ni="npm install"
alias nid="npm install --save-dev"
alias nig="npm install -g"
alias nr="npm run"
alias ns="npm start"
alias nt="npm test"
alias nb="npm run build"
alias nls="npm list"
alias nout="npm outdated"
alias nup="npm update"

# Prevent accidental yarn usage

alias yarn='echo "❌ Yarn removed. Use pnpm for new projects or npm for legacy. Try: pnpm install"'

# ═══════════════════════════════════════════════════════════════════════

# 🎨 EDITORS CONFIGURATION - Professional Setup

# ═══════════════════════════════════════════════════════════════════════

# Force VSCode as default for 'code' command

function code() {
if command -v '/mnt/c/Users/HACKTU/AppData/Local/Programs/Microsoft VS Code/bin/code' >/dev/null 2>&1; then
'/mnt/c/Users/HACKTU/AppData/Local/Programs/Microsoft VS Code/bin/code' "$@"
else
echo "❌ VSCode not found. Install VSCode or use: vscode, cursor, or windsurf"
return 1
fi
}

# Explicit editor commands

alias vscode='code' # VSCode (default)
alias cursor='/mnt/c/Users/HACKTU/AppData/Local/Programs/cursor/resources/app/bin/cursor'
alias windsurf='/mnt/c/Users/HACKTU/AppData/Local/Programs/Windsurf/bin/windsurf'

# Quick editor shortcuts

alias c.='code .' # Open current directory in VSCode
alias cur.='cursor .' # Open current directory in Cursor
alias ws.='windsurf .' # Open current directory in Windsurf

# Editor with specific files

alias readme='code README.md'
alias config='code ~/.zshrc'

# Set default EDITOR environment variable

export EDITOR="code --wait"
export VISUAL="code --wait"

# ═══════════════════════════════════════════════════════════════════════

# 📦 PNPM CONFIGURATION & ALIASES - Configuración y Aliases de pnpm

# ═══════════════════════════════════════════════════════════════════════

# pnpm setup and configuration

export PNPM_HOME="/home/tumidev/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"_) ;;
_) export PATH="$PNPM_HOME:$PATH" ;;
esac

# pnpm end

# Remove any existing pnpm aliases

unalias pnpm 2>/dev/null

# ═══════════════════════════════════════════════════════════════════════

# 🚀 PNPM ALIASES - Aliases Profesionales para pnpm

# ═══════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────

# 📥 INSTALLATION COMMANDS - Comandos de Instalación

# ─────────────────────────────────────────────────────────────────────────

alias pi="pnpm install" # Instalar dependencias
alias pa="pnpm add" # Agregar paquete
alias pad="pnpm add --save-dev" # Agregar como dev dependency  
alias pag="pnpm add --global" # Instalar globalmente
alias paD="pnpm add --save-dev" # Alias alternativo para dev
alias pap="pnpm add --save-peer" # Agregar peer dependency
alias pao="pnpm add --save-optional" # Agregar optional dependency

# ─────────────────────────────────────────────────────────────────────────

# 🗑️ REMOVAL COMMANDS - Comandos de Eliminación

# ─────────────────────────────────────────────────────────────────────────

alias prm="pnpm remove" # Remover paquete
alias prmg="pnpm remove --global" # Remover paquete global
alias prmd="pnpm remove --save-dev" # Remover dev dependency

# ─────────────────────────────────────────────────────────────────────────

# ⚡ EXECUTION COMMANDS - Comandos de Ejecución

# ─────────────────────────────────────────────────────────────────────────

alias px="pnpm exec" # Ejecutar comando local
alias pxd="pnpm dlx" # Ejecutar paquete remoto sin instalación
alias pr="pnpm run" # Ejecutar script
alias ps="pnpm start" # Iniciar aplicación
alias pd="pnpm run dev" # Modo desarrollo
alias pb="pnpm run build" # Construir proyecto
alias pt="pnpm test" # Ejecutar tests
alias ptw="pnpm test:watch" # Tests en modo watch
alias pl="pnpm run lint" # Ejecutar linter
alias plf="pnpm run lint:fix" # Ejecutar y reparar linting
alias pf="pnpm run format" # Formatear código

# ─────────────────────────────────────────────────────────────────────────

# 🔍 INFORMATION COMMANDS - Comandos de Información

# ─────────────────────────────────────────────────────────────────────────

alias pls="pnpm list" # Listar paquetes instalados
alias plsg="pnpm list --global" # Listar paquetes globales
alias pwhy="pnpm why" # Por qué está instalado un paquete
alias pout="pnpm outdated" # Paquetes desactualizados
alias paudit="pnpm audit" # Auditoria de seguridad
alias pinfo="pnpm info" # Información de paquete

# ─────────────────────────────────────────────────────────────────────────

# 🔄 UPDATE & MAINTENANCE - Actualización y Mantenimiento

# ─────────────────────────────────────────────────────────────────────────

alias pup="pnpm update" # Actualizar dependencias
alias pupg="pnpm update --global" # Actualizar paquetes globales  
alias pupi="pnpm update --interactive" # Actualización interactiva
alias pupl="pnpm update --latest" # Actualizar a últimas versiones
alias pprune="pnpm prune" # Limpiar dependencias no usadas

# ─────────────────────────────────────────────────────────────────────────

# 🏪 STORE & CACHE - Gestión de Cache y Store

# ─────────────────────────────────────────────────────────────────────────

alias pstore="pnpm store status" # Estado del store
alias pstp="pnpm store prune" # Limpiar store no usado
alias pstpath="pnpm store path" # Ruta del store

# ─────────────────────────────────────────────────────────────────────────

# 🔗 WORKSPACE COMMANDS - Comandos para Workspaces/Monorepos

# ─────────────────────────────────────────────────────────────────────────

alias pwsr="pnpm -r" # Ejecutar en todos los workspaces
alias pwsls="pnpm -r list" # Listar en todos los workspaces
alias pwsup="pnpm -r update" # Actualizar todos los workspaces
alias pwst="pnpm -r test" # Test en todos los workspaces
alias pwsb="pnpm -r build" # Build de todos los workspaces
alias pwf="pnpm --filter" # Filtrar workspace específico

# ─────────────────────────────────────────────────────────────────────────

# 🚀 MODERN WORKFLOW OPTIMIZATIONS - Optimizaciones de Flujo Moderno

# ─────────────────────────────────────────────────────────────────────────

alias pci="pnpm install --frozen-lockfile" # CI/CD installation
alias pcif="pnpm install --frozen-lockfile --prefer-frozen-lockfile" # Instalación rápida CI
alias pdev="pnpm install && pnpm run dev" # Instalar y iniciar desarrollo
alias pfresh="rm -rf node_modules pnpm-lock.yaml && pnpm install" # Instalación limpia
alias pcheck="pnpm audit && pnpm outdated" # Chequeo completo
alias pdeps="pnpm list --depth=0" # Dependencias de primer nivel
alias psize="pnpm list --depth=0 --json | jq '.dependencies | length'" # Contar dependencias

# ─────────────────────────────────────────────────────────────────────────

# 🎯 PROJECT SHORTCUTS - Atajos Específicos de Proyecto

# ─────────────────────────────────────────────────────────────────────────

alias pnext="pnpm create next-app" # Crear app Next.js
alias pvite="pnpm create vite" # Crear app Vite
alias preact="pnpm create react-app" # Crear app React
alias pstorybook="pnpm dlx storybook@latest init" # Inicializar Storybook
alias ptailwind="pnpm add -D tailwindcss postcss autoprefixer && pnpm dlx tailwindcss init -p" # Setup Tailwind

# ─────────────────────────────────────────────────────────────────────────

# 💡 HELPFUL FUNCTIONS - Funciones Útiles para pnpm

# ─────────────────────────────────────────────────────────────────────────

# Función para crear y cambiar a un nuevo proyecto

pnew() {
if [[-z "$1"]]; then
echo "❌ Uso: pnew <nombre-proyecto> [template]"
echo "📝 Ejemplos:"
echo " pnew mi-app"
echo " pnew mi-app vite"
echo " pnew mi-app next"
return 1
fi

    local project_name="$1"
    local template="${2:-vite}"

    case "$template" in
        "next"|"nextjs")
            pnpm create next-app "$project_name" && cd "$project_name"
            ;;
        "vite")
            pnpm create vite "$project_name" && cd "$project_name" && pnpm install
            ;;
        "react")
            pnpm create react-app "$project_name" && cd "$project_name"
            ;;
        *)
            mkdir "$project_name" && cd "$project_name" && pnpm init
            ;;
    esac

}

# Función para instalar tipos TypeScript comunes

ptypes() {
echo "🔧 Installing common TypeScript types..."
pnpm add -D @types/node @types/react @types/react-dom typescript
}

# Función para setup completo de desarrollo

psetup() {
echo "🚀 Setting up complete development environment..."
pnpm install
if [[-f "package.json"]] && grep -q "\"dev\":" package.json; then
echo "📦 Installing dependencies and starting development server..."
pnpm run dev
else
echo "✅ Dependencies installed successfully!"
fi
}

# ═══════════════════════════════════════════════════════════════════════════════════════

# 📚 DEVELOPMENT GUIDE - Guía de Desarrollo

# ═══════════════════════════════════════════════════════════════════════════════════════

#

# 🎯 PNPM QUICK REFERENCE - Referencia Rápida de pnpm:

#

# 📥 Instalación:

# pi → pnpm install (instalar dependencias)

# pa <pkg> → pnpm add <pkg> (agregar paquete)

# pad <pkg> → pnpm add --save-dev <pkg> (dependencia de desarrollo)

# pag <pkg> → pnpm add --global <pkg> (instalación global)

#

# ⚡ Ejecución:

# px <cmd> → pnpm exec <cmd> (ejecutar comando local)

# pxd <pkg> → pnpm dlx <pkg> (ejecutar sin instalar)

# pr <script> → pnpm run <script> (ejecutar script de package.json)

# pd → pnpm run dev (modo desarrollo)

# pb → pnpm run build (construir proyecto)

#

# 🔧 Mantenimiento:

# pup → pnpm update (actualizar dependencias)

# pcheck → audit + outdated (verificación completa)

# pfresh → instalación completamente limpia

# pstatus → pnpm store status (estado del cache)

#

# 🚀 Flujos Modernos:

# pnew <name> → crear nuevo proyecto con template

# psetup → instalar dependencias e iniciar desarrollo

# ptypes → instalar tipos TypeScript comunes

#

# 🔍 Para ver todos los aliases disponibles: alias | grep "^p"

# 📖 Documentación completa de pnpm: https://pnpm.io/

# ═══════════════════════════════════════════════════════════════════════════════════════
