FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN echo "Installing dependencies..." && \
apt-get -y --no-install-recommends update && \
apt-get -y --no-install-recommends upgrade && \
apt-get install -y --no-install-recommends \
build-essential \
cmake \
git \
python-setuptools \
python3 \
python3-dev \
python3-pip \
        python3-wheel \
python3-setuptools \
libopencv-dev

ENV FREELABEL_ROOT=/usr/bin/freelabel
WORKDIR $FREELABEL_ROOT

RUN echo "Downloading and building Freelabel..." && \
git clone --single-branch --branch main --depth 1 https://github.com/philadias/freelabel.git .

RUN python3.10 -m pip install --upgrade pip

RUN python3.10 -m pip install -r requirements.txt 

WORKDIR $FREELABEL_ROOT/freelabel

RUN python3.10 setup.py build_ext --inplace

WORKDIR $FREELABEL_ROOT

RUN python3.10 manage.py migrate


