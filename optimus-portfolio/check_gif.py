from moviepy import VideoFileClip
import os

gif_path = r"c:\Users\tundt\Desktop\Tund_Personal-Website\optimus-portfolio\public\assets\pupperwalkdomain.gif"

try:
    clip = VideoFileClip(gif_path)
    print(f"FPS: {clip.fps}")
    print(f"Duration: {clip.duration}")
    print(f"Size: {clip.size}")
    clip.close()
except Exception as e:
    print(f"Error: {e}")
