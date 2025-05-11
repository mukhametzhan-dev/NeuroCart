# Unix timestamp
import datetime
timestamp = 1741786035

# Convert to a datetime object
expiration_time = datetime.datetime.fromtimestamp(timestamp)

# Print the human-readable date and time
print(expiration_time)