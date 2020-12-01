
bm () {
    if [[ $1 == "cd" ]]; then
        return=$(node ~/bm/bm.js "$1" "$2" "$3" "$4")
        cd $return
    else
        node ~/bm/bm.js "$1" "$2" "$3" "$4";
    fi

    if [[ $1 == "mkdir" ]]; then
        if [[ -e ~/bm/dir-shortcuts.bash ]]; then
            source ~/bm/dir-shortcuts.bash
        fi
    fi
}

if [[ -e ~/bm/dir-shortcuts.bash ]]; then
    source ~/bm/dir-shortcuts.bash
else
    touch ~/bm/dir-shortcuts.bash
fi