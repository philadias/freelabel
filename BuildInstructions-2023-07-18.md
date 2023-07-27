## Alternate build instructions

Inspired by [this newsletter post, 'Relieving your Python packaging pain'](https://www.bitecode.dev/p/relieving-your-python-packaging-pain), here are simplified instructions for building and running Freelabel.

1. what is your python version?  Find out with `python --version`. We'll use whatever that version is, so mine is:

```bash
$ python3 --version
Python 3.6.9
```

`python3.6`. Replace with whatever version you have.

1. `mkdir python-env`
1. `python3.6 -m venv python-env`.
1. `source python-env/bin/activate`
1. `python3.6 -m pip install --upgrade pip`
1. `python3.6 -m pip install -r requirements.txt`
1. `cd freelabel`
1. `python3.6 setup.py build_ext --inplace`
1. `cd ..`
1. `python3.6 manage.py migrate`
1. `python3.6 manage.py runserver localhost:9000`
