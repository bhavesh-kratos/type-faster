import socket
from transformers import GPT2LMHeadModel, GPT2Tokenizer, pipeline
from symspellpy import SymSpell, Verbosity
import os
import torch

tokenizer = GPT2Tokenizer.from_pretrained("distilgpt2")
model = GPT2LMHeadModel.from_pretrained("distilgpt2")

sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

dictionary_path = os.path.join("frequency_bigramdictionary_en_243_342.txt")  # Update path as needed
if not sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1):
    raise Exception("Dictionary file not found. Please download and place it in the same directory.")

HOST = "127.0.0.1"
PORT = 65432

def generate_prediction(text):
    if not text.strip():
        raise ValueError("Input text is empty.")

    # Tokenize input
    inputs = tokenizer.encode(text, return_tensors='pt')
    attention_mask = torch.ones_like(inputs)  # Create an attention mask

    # Generate the next token
    outputs = model.generate(
        inputs,
        attention_mask=attention_mask,
        max_length=inputs.shape[1] + 1,  # Generate one additional token
        num_return_sequences=1
    )

    # Decode the generated token
    generated_token = tokenizer.decode(outputs[0][-1], skip_special_tokens=True)
    return generated_token


model_name = "vennify/t5-base-grammar-correction"
corrector = pipeline("text2text-generation", model=model_name)

def autocorrect_text(input_text):
    """
    Autocorrect the input text using a pre-trained transformer model.

    Args:
        input_text (str): The input text to be corrected.

    Returns:
        str: The autocorrected text.
    """
    try:
        # Generate the corrected text
        corrected = corrector(f"fix: {input_text}", max_length=128, truncation=True)
        return corrected[0]['generated_text']
    except Exception as e:
        print(f"Error during autocorrection: {e}")
        return input_text  # Return original text in case of error


def handle_client_connection(conn, addr):
    """
    Handle communication with the connected client.

    Args:
        conn (socket.socket): The socket object for the client connection.
        addr (tuple): The address of the client.
    """
    with conn:
        print(f"Connected by {addr}")
        while True:
            data = conn.recv(1024).decode('utf-8').strip()
            if not data:
                break

            print(f"Received: {data}")

            if data.startswith("PREDICT:"):
                text = data[len("PREDICT:"):]
                response = generate_prediction(text)
                response = f"PREDICTION:{response}"
            elif data.startswith("AUTOCORRECT:"):
                text = data[len("AUTOCORRECT:"):]
                response = autocorrect_text(text)
                response = f"CORRECTED:{response}"
            else:
                response = "ERROR: Unknown command. Use PREDICT: or AUTOCORRECT:"

            conn.sendall(response.encode('utf-8'))
            print(f"Sent: {response}")


def main():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        server_socket.bind((HOST, PORT))
        server_socket.listen(1)
        print(f"Server running on {HOST}:{PORT}")

        while True:
            conn, addr = server_socket.accept()
            handle_client_connection(conn, addr)  # Handle each client connection in a new function

if __name__ == "__main__":
    main()
