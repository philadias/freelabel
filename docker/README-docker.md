# Create docker container
sudo docker build -t freelabel-docker .

# Enter container with support to access webpage through localhost
sudo docker run --network="host" -it freelabel-docker python3 manage.py runserver 0.0.0.0:9000

** To use a local folder within the interface, add the flag: -v /your/source/folder/:/opt/freelabel/

sudo docker run -v $PWD:/opt/freelabel/  --network="host" -it freelabel-docker python3 manage.py runserver 0.0.0.0:9000

OR


sudo docker run -v $PWD:/opt/freelabel/  --network="host" -it freelabel-docker 


sudo docker run -v /your/source/folder/:/opt/freelabel/  --network="host" -it freelabel-docker bash

sudo docker run -v $PWD:/home/freelabel-user/freelabel --network="host" -it freelabel-docker python3 manage.py runserver 0.0.0.0:9000

# Start server if you haven't started it from the docker run.
python3 manage.py runserver 0.0.0.0:9000

# Open interface in browser
http://localhost:9000/freelabel
