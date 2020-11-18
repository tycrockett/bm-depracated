function prompt_command() {
    directory=$(node ~/bm/theme.js)
    PS1=$directory
}
PROMPT_COMMAND=prompt_command