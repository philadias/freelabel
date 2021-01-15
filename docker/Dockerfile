FROM ubuntu:18.04
ENV DEBIAN_FRONTEND=noninteractive

RUN echo "Installing dependencies..." && \
	apt-get -y --no-install-recommends update && \
	apt-get -y --no-install-recommends upgrade && \
	apt-get install -y --no-install-recommends \
	build-essential \
	cmake \
	git \
	python-setuptools \
	python3.6 \
	python3-dev \
	python3-pip \
	python3-setuptools \
	libopencv-dev

ENV FREELABEL_ROOT=/opt/freelabel
WORKDIR $FREELABEL_ROOT

RUN echo "Downloading and building Freelabel..." && \
	git clone --single-branch --branch master https://github.com/philadias/freelabel.git .

RUN echo "Create virtual environment..." && \
	pip3 install --upgrade pip && pip3 install virtualenv

WORKDIR $FREELABEL_ROOT/freelabel

#RUN virtualenv -p python3 .

#RUN echo "Configure virtual environment..." 

#RUN "source ./bin/activate"

RUN pip3 install -r ../requirements.txt

RUN echo "Compile RGR..."

RUN python3 setup.py build_ext --inplace

WORKDIR $FREELABEL_ROOT

RUN echo "**** FOLLOW INSTRUCTIONS FROM README_Instructions.md TO START INTERFACE (printed below) *****" 

RUN cat /opt/freelabel/docker/README_Instructions.md
