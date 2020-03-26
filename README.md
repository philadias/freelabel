FreeLabel: A Publicly Available Annotation Tool based on Freehand Traces

## Underlying ideas: the paper
This README file is to accompany code for pixel-level image annotation, lead by Philipe Dias to his paper: FreeLabel: A Publicly Available Annotation Tool based on Freehand Traces published in [WACV 2019](https://ieeexplore.ieee.org/document/8659167):

```
@INPROCEEDINGS{8659167,
author={P. A. {Dias} and Z. {Shen} and A. {Tabb} and H. {Medeiros}},
booktitle={2019 IEEE Winter Conference on Applications of Computer Vision (WACV)},
title={FreeLabel: A Publicly Available Annotation Tool Based on Freehand Traces},
year={2019},
volume={},
number={},
pages={21-30},
keywords={computer vision;image segmentation;Internet;learning (artificial intelligence);public domain software;user interfaces;freehand scribbles;FreeLabel;intuitive open-source Web interface;agricultural domain;high-quality segmentation masks;deep learning models;image understanding tasks;image segmentation datasets;large-scale annotation;freehand traces;image dataset;private annotation;crowdsourced annotation;PASCAL dataset;Image segmentation;Tools;Labeling;Training;Task analysis;Level set;Image color analysis},
doi={10.1109/WACV.2019.00010},
ISSN={1550-5790},
month={Jan},}
```
This paper is also available from arXiv:1902.06806 [cs.CV] [here](https://arxiv.org/abs/1902.06806). The arxiv version is identical in content to the IEEE version.

## Citing the code
The code may be used according to the license below.  If the results of the code are used as a part of a system described in a publication, we request that the authors cite the published paper at a minimum. 

### Disclaimer: this project is the first experience of the involved students with Javascript and Django. Despite our efforts to keep it fairly organized and functional, there is significant room for improvement. We appreciate any feedback for improving the tool, but cannot provide any type of support/warranty

### Available under the Non-Profit Open Software License: for more details https://opensource.org/licenses/NPOSL-3.0

## Notes on code organization: check Notes_on_FreeLabel.pdf

## Requirements:
- python3 and corresponding pip3
- virtualenv, which can be installed through 'pip install virtualenv' (see https://virtualenv.pypa.io/en/latest/installation/)

## Download, configuration and deploying the interface:
1. clone repository
2. cd freelabel-wacv/
3. create virtual environment: virtualenv . (if you have multiple python versions, run: virtualenv -p python3 .)
4. enter virtual environment: source ./bin/activate
5. install requirements: pip install -r requirements.txt (if it fails, try upgrading pip: pip install --upgrade pip)
6. Recompile callRGR: 
	- cd freelabel
	- python setup.py build_ext --inplace
	- cd ..
	
7. run Django project: python manage.py runserver 0.0.0.0:9000

---

## Accessing the interface:
1. access http://localhost:9000/freelabel/
2. register user/password (no need for email)
2. login with registered user
3. Done!

## Working with custom datasets (added March 25th 2020)
The branch 'beta_custom_datasets' now supports annotating images from a local folder. Some comments:
- In addition to the images to be annotated, insert in your local folder a file named 'categories.txt' that contains the categories to be annotated. It follows the PASCAL standard, with one category per line. One example file was added to this repository.
	
- The code is set to deal with .jpg images. To change the extention, edit line 111 of ./freelabel/views.py, in function loadcustom

- Colors assigned to each category are defined in 'static/js/base.js', function 'color_choose()'

## Accelerate refinement time if needed
- If the code crashes when calling the refinement function, very likely its due to timeout. Thera are two options to overcome this:
1. decrease the number of refinement iterations, which is defined as "numSets" in ourLib.py (function main, line 107)
2. increase the timeout threshold in .js files (customsetB.js function callRefineCustom, base.js function callRefine)
