from django.core.paginator import Paginator as Paginator_

Paginator = Paginator_

__all__ = ['Paginator', 'IDPaginator']


def chunks(l, n):
    """ Yield successive n-sized chunks from l.
    """
    for i in xrange(0, len(l), n):
        yield l[i:i+n]


class IDPaginator(object):
    """
    Simple paginator for IDs list. It assumes paginated
    IDs list is (mostly) sorted.

    self.pages - a list of pages

        A page is a dict:
        {
            'start_id': (int) id at page start,
            'end_id': (int) id at page end,
            'number': (int) page number,
            'is_current': (bool) page is current
        }

    self.current_page
    self.prev_page
    self.next_page - current, previous and next pages
    self.count - total number of objects
    self.num_pages - total number of pages
    """
    def __init__(self, id_list, per_page, id_value=None):
        self._objects = id_list
        self._chunks = chunks(id_list, per_page)
        self.count = len(id_list)
        self.pages = []
        self.current_page = None
        self.prev_page = None
        self.next_page, next_index = None, None
        for n, chunk in enumerate(self._chunks):
            if id_value:
                is_current = bool(id_value in chunk)
                # is_current = id_value >= min(chunk[0], chunk[-1]) and \
                #              id_value <= max(chunk[0], chunk[-1])
            else:
                is_current = n == 0
            page = {
                'start_id': int(chunk[0]),
                'end_id': int(chunk[-1]),
                'number': n + 1,
                'is_current': is_current,
            }
            self.pages.append(page)
            if is_current:
                page['id_list'] = chunk
                self.current_page = page
                self.prev_page = n and self.pages[n - 1] or None
                next_index = n + 1
            elif next_index:
                self.next_page = self.pages[next_index]
                next_index = None
        self.start_id = self.pages[0]['start_id']
        self.end_id = self.pages[-1]['end_id']
        self.num_pages = len(self.pages)
