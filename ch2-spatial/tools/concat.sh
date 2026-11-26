#!/bin/bash
# usage: concat.sh <segdir> <out.mp4>  -- video stream copy from segments, one continuous audio track from assets/sfx.wav
set -e
D=$1; OUT=$2; P=/home/user/hyperframes/ch2-spatial
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i $D/list.txt -c:v copy -an /tmp/_video_only.mp4
ffmpeg -y -hide_banner -loglevel error -i /tmp/_video_only.mp4 -i $P/assets/sfx.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 178 -movflags +faststart $OUT
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,r_frame_rate,width,height,duration -of default=nw=1 $OUT
ffprobe -v error -show_entries format=duration -of default=nw=1 $OUT
ffmpeg -hide_banner -i $OUT -af ebur128=peak=true -vn -f null - 2>&1 | grep -E "True peak|Peak:|I:  " | tail -3
