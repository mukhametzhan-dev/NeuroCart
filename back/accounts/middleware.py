# # store/middleware.py
# import random, string
# from django.utils.deprecation import MiddlewareMixin
# from store.tasks import create_welcome_coupon

# class PromoMiddleware(MiddlewareMixin):
#     def __call__(self, request):
#         code = None
#         if not request.COOKIES.get("promo_seen"):
#             code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
#             request.promo_code = code
#             # асинхронно создаём купон
#             create_welcome_coupon.delay(code, request.META.get("REMOTE_ADDR"))
#         response = self.get_response(request)
#         if code:
#             response.set_cookie("promo_seen", "1", max_age=31536000)
#         return response
