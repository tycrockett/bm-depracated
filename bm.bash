
bm () {
    if [[ $1 == "cd" ]]; then
        return=$(node ~/bm/bm.js "$1" "$2" "$3" "$4")
        cd $return
    else

        if [[ $1 == "r" || $1 == "run" ]]; then
            cmd=$(node ~/bm/bm.js "$1" "$2" "$3" "$4")
            echo $cmd
            eval "$cmd"
        else
            node ~/bm/bm.js "$1" "$2" "$3" "$4";
        fi

    fi

    if [[ $1 == "mkdir" ]]; then
        if [[ -e ~/bm/dir-shortcuts.bash ]]; then
            source ~/bm/dir-shortcuts.bash
        fi
    fi
}

cmd () {
    bm cmd "$1" "$2" "$3" "$4" "$5"
}

if [[ -e ~/bm/dir-shortcuts.bash ]]; then
    source ~/bm/dir-shortcuts.bash
else
    touch ~/bm/dir-shortcuts.bash
fi