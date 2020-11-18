
bm () {
    if [ -n $1 ]; then
        if [ $1 == "cd" ]; then
            return=$(node ~/branch-manager/bm.js "$1" "$2" "$3" "$4")
            cd $return
        else
            node ~/branch-manager/bm.js "$1" "$2" "$3" "$4";
        fi
        echo
    fi
}