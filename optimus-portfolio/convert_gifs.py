from moviepy import VideoFileClip
import os

assets_dir = r"c:\Users\tundt\Desktop\Tund_Personal-Website\optimus-portfolio\public\assets"
gifs = ["pupperwalkdomain.gif", "kinematics.gif"]

for gif_name in gifs:
    gif_path = os.path.join(assets_dir, gif_name)
    mp4_name = gif_name.replace(".gif", ".mp4")
    mp4_path = os.path.join(assets_dir, mp4_name)
    
    print(f"Converting {gif_name} (Size: {os.path.getsize(gif_path)/1024/1024:.2f} MB)...")
    
    try:
        clip = VideoFileClip(gif_path)
        # Write to mp4 with H.264 codec, optimized for web (crf 23 is default good quality/size)
        # yuv420p is needed for compatibility with quicktime/browsers
        clip.write_videofile(mp4_path, codec="libx264", audio=False, preset="medium", ffmpeg_params=["-pix_fmt", "yuv420p", "-crf", "23"])
        clip.close()
        print(f"Success! Output: {mp4_name} (Size: {os.path.getsize(mp4_path)/1024/1024:.2f} MB)")
    except Exception as e:
        print(f"Failed to convert {gif_name}: {e}")
