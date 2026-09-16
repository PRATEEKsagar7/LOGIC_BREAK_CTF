import time

class WorkerQueue:
    def __init__(self):
        self.queue = []

    def enqueue(self, task):
        self.queue.append({'task': task, 'time': time.time()})

    def process_all(self):
        while self.queue:
            item = self.queue.pop(0)
            # Process item
            pass
