@echo off
:script_check
if .%1==. (
exit
)
if not defined temporary_folder exit
:ks-flate_trials
setlocal enabledelayedexpansion
color 0f
set "name=KS-Flate trials"
set "version=14.02.2014"
title %name% - %version%
:settings
set "file_name=%~n1"
set "file_size=%~z1"
set "number_of_trials=0"
set "number_of_pass_a=0"
set "number_of_pass_b=0"
set "mix_with_origine=0"

	:trials
	call:refresh
	:: Run 4 trials
	for /L %%i in (1,1,4) do start /b /low /wait pngout -f6 -r -k0 -kp -ks -q -y -force "%~f1" "%temporary_folder%%~n1-%%i.png"
	:: Mix trials
	huffmix -q "%temporary_folder%%~n1-1.png" "%temporary_folder%%~n1-2.png" "%temporary_folder%%~n1-12.png"
	huffmix -q "%temporary_folder%%~n1-3.png" "%temporary_folder%%~n1-4.png" "%temporary_folder%%~n1-34.png"
	huffmix -q "%temporary_folder%%~n1-12.png" "%temporary_folder%%~n1-34.png" "%temporary_folder%%~n1-f.png"
		:: Optimize deflate stream
		call:deflate_optimizer "%temporary_folder%%~n1-f.png" >nul
	:: Save, check_compare
	1>nul 2>&1 copy /b /y "%temporary_folder%%~n1-f.png" "%temporary_folder%%~n1-x%number_of_pass_a%.png"
	call:check_compare "%~f1" "%temporary_folder%%~n1-f.png"
	:: Counters
	set /a "number_of_trials+=4"
	set /a "number_of_pass_a+=1"
		:: Pass mixing A
		if %number_of_pass_a% equ 4 (
		huffmix -q "%temporary_folder%%~n1-x0.png" "%temporary_folder%%~n1-x1.png" "%temporary_folder%%~n1-x01.png"
		huffmix -q "%temporary_folder%%~n1-x2.png" "%temporary_folder%%~n1-x3.png" "%temporary_folder%%~n1-x23.png"
		huffmix -q "%temporary_folder%%~n1-x01.png" "%temporary_folder%%~n1-x23.png" "%temporary_folder%%~n1-xf.png"
			call:deflate_optimizer "%temporary_folder%%~n1-xf.png" >nul
			1>nul 2>&1 copy /b /y "%temporary_folder%%~n1-xf.png" "%temporary_folder%%~n1-w%number_of_pass_b%.png"
		call:check_compare "%~f1" "%temporary_folder%%~n1-xf.png"
		1>nul 2>&1 del /f /q "%temporary_folder%%~n1-x*.png"
		set "number_of_pass_a=0"
		set /a "number_of_pass_b+=1"
		)
			:: Pass mixing B
			if %number_of_pass_b% equ 2 (
			huffmix -q "%temporary_folder%%~n1-w0.png" "%temporary_folder%%~n1-w1.png" "%temporary_folder%%~n1-w01.png"
			call:deflate_optimizer "%temporary_folder%%~n1-w01.png" >nul		
			call:check_size "%~f1" "%temporary_folder%%~n1-w01.png"
				1>nul 2>&1 copy /b /y "%temporary_folder%%~n1-w01.png" "%temporary_folder%%~n1-mix.png"
			call:check_compare "%~f1" "%temporary_folder%%~n1-w01.png"
			1>nul 2>&1 del /f /q "%temporary_folder%%~n1-w*.png"
			set "number_of_pass_b=0"
			)
				:: Mix with original file
				if %mix_with_origine% equ 1 (
				1>nul 2>&1 huffmix -q "%~f1" "%temporary_folder%%~n1-mix.png" "%temporary_folder%%~n1-z.png"
				if exist "%temporary_folder%%~n1-z.png" call:deflate_optimizer "%temporary_folder%%~n1-z.png" >nul
				if exist "%temporary_folder%%~n1-z.png" call:check_compare "%~f1" "%temporary_folder%%~n1-z.png"
				1>nul 2>&1 del /f /q "%temporary_folder%%~n1-*.png"
				set "mix_with_origine=0"
				)
	set "trial_size=%~z1"
	:: Exit if smaller
	if %trial_size% lss %file_size% exit
	goto:trials

:deflate_optimizer
deflopt -k -b -s "%~f1" >nul
1>nul 2>nul defluff < "%~f1" > "%~f1.tmp"
call:check_move "%~f1" "%~f1.tmp"
deflopt -k -b -s "%~f1" >nul
exit /b
	
:: Comparators ::

:check_size
set "size_a=%~z1"
set "size_b=%~z2"
if %size_a% leq %size_b% set "mix_with_origine=1"
exit /b
:check_move
1>nul 2>&1 move /y %2 %1
exit /b
:check_compare
if %~z1 leq %~z2 (1>nul 2>&1 del /f /q %2) else (1>nul 2>&1 move /y %2 %1 || exit /b 1)
exit /b
:refresh
cls
title [%number_of_trials%] - %file_name%.png
echo.
echo.
echo  %name% - %version%
echo.
echo.
echo  "%file_name%.png"
echo  In  : %file_size% Bytes
echo  Out : %file_size% Bytes - (%number_of_trials% KS-Flate trials)
echo.
exit /b