# Create docker container
sudo docker build -t freelabel-docker .

# Enter container with support to access webpage through localhost
sudo docker run -v $PWD:/usr/bin/freelabel/  --network="host" -it freelabel-docker bash

OR

sudo docker run -v $PWD:/usr/bin/freelabel/  --network="host" -it freelabel-docker python3 manage.py runserver localhost:9000 

# Start server if you haven't started it from the docker run.
python3 manage.py runserver localhost:9000

# Open interface in browser
http://localhost:9000/freelabel
