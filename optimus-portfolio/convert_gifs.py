from moviepy import VideoFileClip
import os

assets_dir = r"c:\Users\tundt\Desktop\Tund_Personal-Website\optimus-portfolio\public\assets"
# Only process the main file
gifs = ["pupperwalkdomain.gif"]

for gif_name in gifs:
    gif_path = os.path.join(assets_dir, gif_name)
    mp4_name = gif_name.replace(".gif", ".mp4")
    mp4_path = os.path.join(assets_dir, mp4_name)
    
    print(f"Converting {gif_name} (Size: {os.path.getsize(gif_path)/1024/1024:.2f} MB)...")
    
    try:
        clip = VideoFileClip(gif_path)
        
        # Resize to 720p for better web performance and to smooth out some noise
        # This also often helps with the "bars" artifacts if they were resolution/stride related
        if clip.w > 1280:
             clip = clip.resized(width=1280)
             
        # Write to mp4
        # crf 18 is high quality (visually nearly lossless)
        # fps=30 for standard smooth playback
        clip.write_videofile(
            mp4_path, 
            codec="libx264", 
            audio=False, 
            preset="slow", # Better compression efficiency 
            fps=30,
            ffmpeg_params=["-pix_fmt", "yuv420p", "-crf", "18"] 
        )
        clip.close()
        print(f"Success! Output: {mp4_name} (Size: {os.path.getsize(mp4_path)/1024/1024:.2f} MB)")
    except Exception as e:
        print(f"Failed to convert {gif_name}: {e}")
