# Create docker container
sudo docker build -t freelabel-docker .

# Enter container with support to access webpage through localhost
sudo docker run --network="host" -it
** To use a local folder within the interface, add the flag: -v /your/source/folder/:/folder/in/docker/

# Navigate to folder containing Freelabel
cd /opt/freelabel

# Enter virtual environment
source bin/activate

# Start server
python3 manage.py runserver 0.0.0.0:9000

# Open interface in browser
http://localhost:9000/freelabel
