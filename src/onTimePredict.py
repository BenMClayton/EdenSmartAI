import tensorflow as tf
import json
import numpy as np

# Function to read the JSON file
def read_json_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

# Read data from the JSON file
file_path = '../test/dataRetrieving/on-time-prediction-dataset.json'
data = read_json_file(file_path);

print(data.keys());

# Generate some example data
# Replace this with your own data
features = data["features"]  # 1000 samples, 5 features
labels = data["values"]  # 0 = late, 1 = on-time

# Create a TensorFlow dataset
dataset = tf.data.Dataset.from_tensor_slices((features, labels))
train_dataset = dataset.shuffle(len(features)).batch(32)

# Define the model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(features.shape[1],)),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

# Compile the model
model.compile(optimizer='adam',
              loss='binary_crossentropy',
              metrics=['accuracy'])

# Train the model
model.fit(train_dataset, epochs=50)

# Make predictions
new_features = np.random.rand(5, 5)  # Replace with the features you want to predict on
predictions = model.predict(new_features)
print(predictions)