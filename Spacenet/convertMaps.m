load('/home/philipe/Codes/prgr/pascalCMap.mat');

filelist = dir('*.mat');
filelist = {filelist.name}';

for it = 1:length(filelist)
    file_ = filelist{it};
    load(file_);
    
    [maxScores,detMask] = max(softScores,[],3);
    
    colorMask = ind2rgb(detMask,cmap);
    
    uncMap = (detUncMap-0.5)/5;
    uncMap(uncMap>1) = 1;
    
    imwrite(colorMask,[file_(1:end-4) '.png'],'Alpha',double(detMask == 2));
    imwrite(uncMap,[file_(1:end-4) '_unc.png']);
    
end