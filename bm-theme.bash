function prompt_command() {
    directory=$(node ~/branch-manager/theme.js)
    PS1=$directory
}
PROMPT_COMMAND=prompt_command
# PROMPT_COMMAND=prompt_command
# safe_append_prompt_command prompt_command