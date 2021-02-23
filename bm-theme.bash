function prompt_command() {
    node ~/bm/handle-fetch.js
    directory=$(node ~/bm/theme.js)
    PS1=$directory
}
PROMPT_COMMAND=prompt_command