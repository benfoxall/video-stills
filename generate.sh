
mkdir -p frames
rm -r frames
mkdir -p frames

for i in `seq 1 50`;
  do
    convert \
      -background \#ddd \
      -fill \#333 \
      -pointsize 200 \
      -gravity center \
      -size 320x320 label:"$i" \
      frames/$(printf %03d $i).png

  done  


ffmpeg -y -framerate 24 -i frames/%03d.png -pix_fmt yuv420p numbers.mp4

ffmpeg -y -i numbers.mp4 -b:a 2M -bt 4M -vcodec libx264 -pass 1 -coder 0 -bf 0 -flags -loop -wpredp 0 -an numbers.b.mp4
