@echo off
setlocal EnableDelayedExpansion

:: directory structure for game development
:: Define directories on separate lines for clarity

set "dir1=Assets"
set "dir2=Assets\Definitions\ThisGame"
set "dir3=Assets\Fonts"
set "dir4=Assets\Graphics"
set "dir5=Assets\Models"
set "dir6=Assets\Objects"
set "dir7=Assets\Sounds"
set "dir8=Assets\WASM"

set "dir9=Assets\Graphics\SheetSequences"
set "dir10=Assets\Graphics\Sprites"
set "dir11=Assets\Graphics\Textures"
set "dir42=Assets\Graphics\Packs"
set "dir43=Assets\Graphics\RotatedSheetSequences"

set "dir12=Assets\Graphics\Sprites\ActionMovables"
set "dir13=Assets\Graphics\Sprites\Doors"
set "dir14=Assets\Graphics\Sprites\EntityPictures"
set "dir15=Assets\Graphics\Sprites\Items"
set "dir16=Assets\Graphics\Sprites\Keys"
set "dir17=Assets\Graphics\Sprites\Lights"
set "dir18=Assets\Graphics\Sprites\ObjDecals"
set "dir19=Assets\Graphics\Sprites\PicDecals"
set "dir20=Assets\Graphics\Sprites\Scrolls"
set "dir21=Assets\Graphics\Sprites\Shrines"
set "dir22=Assets\Graphics\Sprites\Skills"
set "dir23=Assets\Graphics\Sprites\Status"
set "dir24=Assets\Graphics\Sprites\Triggers"
set "dir25=Assets\Graphics\Sprites\UI"
set "dir44=Assets\Graphics\Sprites\Rotated"

set "dir26=Assets\Graphics\Textures\Gates"
set "dir27=Assets\Graphics\Textures\ObjectTextures"
set "dir28=Assets\Graphics\Textures\Title"
set "dir29=Assets\Graphics\Textures\Wall"

set "dir30=Code"
set "dir31=Code\GLSL"
set "dir32=Code\JS"
set "dir33=Code\Python"

set "dir34=Code\GLSL\Shaders"

set "dir35=Code\JS\Library"
set "dir36=Code\JS\Library\Engine"
set "dir41=Code\JS\Library\Misc"

set "dir37=CSS"
set "dir38=External"
set "dir39=Games\ThisGame"
set "dir40=Images"

:: Add more directories as needed, follow the pattern above, next id = 45

:: Initialize directory count
set "count=0"

:: Count the directories defined
for /f "tokens=2 delims==" %%a in ('set dir') do (
    set /a count+=1
)

:: Loop through each directory variable using the count
for /l %%i in (1,1,%count%) do (
    set "dir=!dir%%i!"
    if not exist "!dir!" (
        mkdir "!dir!"
        echo Created directory !dir!
    ) else (
        echo Directory !dir! already exists.
    )
)

echo Done.
endlocal
