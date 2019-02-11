#!/bin/sh

FILE=$1
SECONDS=$2
DIRECTORY="$3"
# STARTING_NUM="$4"

IMG_SIZE=640
MOVIE_SIZE=1024


if [ ! -r $1 ]
then
    echo "file $1 not present or readable"
    exit
fi

# if [ ! -z "$4" ]
# then
#     $STARTING_NUM="000"
# fi

if [ ! -z $2 ] && [ ! -z "$3" ]
then
    # cd record
    if [ -d "$DIRECTORY" ]; then        
        while true; do
            read -p "Directory $DIRECTORY exists. Remove it and proceed?" yn
            case $yn in
                [Yy]* ) rm -r $DIRECTORY; break;;
                [Nn]* ) exit;;
                * ) echo "Please answer yes or no.";;
            esac
        done  
    fi   

    mkdir $DIRECTORY
    cp $FILE $DIRECTORY
    cd $DIRECTORY
    # sleep 3.0
    echo "Recording shader."
    # to load an image, throw it after $FILE ../../source/will_3.png
    glslViewer $FILE -w $IMG_SIZE -h $IMG_SIZE --headless -E sequence,0,$2
    ffmpeg -r 30 -start_number 000 -i %03d.png -vf scale=$MOVIE_SIZE:$MOVIE_SIZE -vcodec libx264 -vb 4096k -bufsize 4096k -minrate 4096k -maxrate 4096k -pix_fmt yuv420p -strict 2 test.mp4
    open .
    open test.mp4   
    cd ../
else
    echo "wrong arguments"
    echo "record.sh filename seconds directory"
fi