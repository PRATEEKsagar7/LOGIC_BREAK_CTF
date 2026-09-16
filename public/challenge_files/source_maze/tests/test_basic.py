import unittest

class BasicSanityTest(unittest.TestCase):
    def test_arithmetic(self):
        self.assertEqual(1 + 1, 2)

if __name__ == '__main__':
    unittest.main()
