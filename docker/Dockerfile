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
	git clone --single-branch --branch spacenet_custom https://github.com/philadias/freelabel.git .

RUN echo "Create virtual environment..." && \
	pip3 install --upgrade pip && pip3 install virtualenv && \
	cd freelabel && virtualenv -p python3 .

RUN echo "Configure virtual environment..." && \
    /bin/bash -c "source ./bin/activate" && \
	pip3 install -r requirements.txt

RUN echo "Compile RGR..." && cd freelabel && \
	python3 setup.py build_ext --inplace

WORKDIR /