[Setup]
AppName=Food Lab System
AppVersion=1.0
DefaultDirName={autopf}\FoodLabSystem
DefaultGroupName=Food Lab System
OutputDir=D:\Intern\food_lab_System\Installer
OutputBaseFilename=FoodLab_System_Setup
Compression=lzma
SolidCompression=yes
SetupIconFile=public\icon.ico

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; 1. Main Executable and files compiled by electron-builder
Source: "D:\Intern\food_lab_System\food_lab_system\dist\win-unpacked\Food Lab System.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\Intern\food_lab_System\food_lab_system\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Food Lab System"; Filename: "{app}\Food Lab System.exe"
Name: "{autodesktop}\Food Lab System"; Filename: "{app}\Food Lab System.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\Food Lab System.exe"; Description: "{cm:LaunchProgram,Food Lab System}"; Flags: nowait postinstall skipifsilent