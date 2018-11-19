FreeLabel: A Publicly Available Annotation Tool based on Freehand Traces

Open-access manuscript: https://www.coviss.org/wp-content/uploads/2018/11/freelabel_preprint.pdf 

WACV proceedings: to be included

## Download, configuration and deploying the interface:
Requires virtualenv , which can be installed through 'pip install virtualenv' (see https://virtualenv.pypa.io/en/latest/installation/)

1. clone repository
2. cd freelabel-wacv/
3. create virtual environment: virtualenv .
4. enter virtual environment: source ./bin/activate
5. install requirements: pip install -r requirements.txt
6. run Django project: python manage.py runserver 0.0.0.0:9000

---

## Accessing the interface:
1. access http://localhost:9000/freelabel/
2. register user/password (no need for email)
2. login with registered user
3. Done!