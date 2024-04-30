# -*- coding: utf-8 -*-
"""
Created on Mon Sep 20 14:51:00 2021

@author: lovro
@version 0.2.1
"""
from os.path import join
from glob import glob

# Directory = 'C:/Users/lovro/OneDrive/Pictures/Games Screens/Done'
# Directory = 'C:/Users/lovro/OneDrive/Pictures/Games Screens/Done_decals'
# Directory = 'C:/Users/lovro/OneDrive/Pictures/Games Screens/Gates'

# Prefix = ''

# Directory = 'C:/Users/lovro/OneDrive/Documents/JS/Invasion/Assets/Graphics/Sprites/Items'
Directory = 'C:/Users/lovro/OneDrive/Documents/JS/GhostRun2/Assets/Graphics/Textures/Wall'
# Prefix = 'Items/'
Prefix = 'Wall/'
files = []
ext = ['*.png', '*.jpg']
# template = '{ srcName: {}, name: {} },\n'

for e in ext:
    files.extend(glob(join(Directory, e)))

files = sorted([f.split('\\')[1] for f in files])
assets = [f'{{ srcName: "{Prefix}{f}", name: "{f.split(".")[0]}" }},' for f in files]
assetText = "\n".join(assets)
nameText = ",".join([f'"{f.split(".")[0]}"' for f in files])
