import functools
from django.db.models.query import QuerySet
from django.db.models import *
from django.core.exceptions import ObjectDoesNotExist


class RangoQuerySet(QuerySet):

    def __getattr__(self, name):
        """
        Proxy query method to Model class.

        That's convinient to define domain specific query
        methods in models and chain them in queries.
        """
        method = getattr(self.model, name)
        return functools.partial(method, _queryset=self)

    def __unicode__(self):
        return u"<%s: %s>" % (self.__class__.__name__, self.model)

    def get(self, *args, **kwargs):
        try:
            return super(RangoQuerySet, self).get(*args, **kwargs)
        except ObjectDoesNotExist:
            pass


class RangoManager(Manager):
    """
    Default manager for RangoModel. It uses smart
    RangoQuerySet for queries.
    """
    def get_query_set(self):
        return RangoQuerySet(self.model, using=self._db)


class RangoModel(Model):
    """
    That's experimental Model class. Let's play with Django ORM
    queries API and try to dry it!

    Now you can define filter methods in models and chain
    them in queries::

        class MyModel(RangoModel):
            is_active = models.BooleanField()

            @classmethod
            def active(cls, _queryset=None):
                return cls.filter(_queryset, is_active=True)


        all_objects = MyModel.all()
        active_objects = all_objects.active()
    """

    objects = RangoManager()

    class Meta:
        abstract = True

    @classmethod
    def all(cls):
        return cls.objects.all()

    @classmethod
    def get(cls, _queryset=None, **kwargs):
        _queryset = (_queryset is None) and cls.objects or _queryset
        try:
            return _queryset.get(**kwargs)
        except cls.DoesNotExist:
            pass

    @classmethod
    def create(cls, **kwargs):
        """
        Creates new instance and saves it to database.
        """
        return cls.objects.create(**kwargs)

    def update(self, **kwargs):
        """
        Updates instance fields. Note that it skips
        ``pre_save`` and ``post_save`` signals.
        """
        self.__class__.objects.filter(pk=self.pk).update(**kwargs)
        return self.__class__.objects.get(pk=self.pk)

    def _query_method(name):
        def method(cls, _queryset=None, **kwargs):
            queryset = (_queryset is None) and cls.objects or _queryset
            return getattr(queryset, name)(**kwargs)
        return method

    exclude = classmethod(_query_method('exclude'))
    filter = classmethod(_query_method('filter'))
    none = classmethod(_query_method('none'))

    # annotate = classmethod(_query_method('annotate'))
    # order_by = classmethod(_query_method('order_by'))
    # reverse = classmethod(_query_method('reverse'))
    # distinct = classmethod(_query_method('distinct'))
    # values = classmethod(_query_method('values'))
    # values_list = classmethod(_query_method('values_list'))
    # dates = classmethod(_query_method('dates'))
    # select_related = classmethod(_query_method('select_related'))
    # prefetch_related = classmethod(_query_method('prefetch_related'))
    # extra = classmethod(_query_method('extra'))
    # defer = classmethod(_query_method('defer'))
    # only = classmethod(_query_method('only'))
    # using = classmethod(_query_method('using'))
    # select_for_update = classmethod(_query_method('select_for_update'))


# def get_object_or_none(klass, *args, **kwargs):
#     """
#     Function is similar to ``get_object_or_404`` but 
#     returns None if the object does not exist.
#     """
#     manager = None
#     queryset = None
#     if isinstance(klass, QuerySet):
#         queryset = klass
#     elif isinstance(klass, Manager):
#         manager = klass
#     else:
#         manager = klass._default_manager
#     try:
#         return (queryset or manager).get(*args, **kwargs)
#     except ObjectDoesNotExist:
#         return None
