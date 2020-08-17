FROM ubuntu:18.04

RUN echo "Installing dependencies..." && \
	apt-get -y --no-install-recommends update && \
	apt-get -y --no-install-recommends upgrade && \
	apt-get install -y --no-install-recommends \
	build-essential \
	cmake \
	git \
	python-setuptools \
	python-dev \
	python-pip \
	libopencv-dev

RUN echo "Downloading and building Freelabel..." && \
	git clone --single-branch --branch spacenet_custom https://github.com/philadias/freelabel.git . && \
	pip install virtualenv && \
	cd freelabel && virtualenv . && source ./bin/activate \
	pip install -r ../requirements.txt && \
	python setup.py build_ext --inplace && \
	cd .. && \
	python manage.py runserver 0.0.0.0:9000