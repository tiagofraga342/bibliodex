# Use uma imagem base oficial do Python
FROM python:3.11-slim 
# Sugestão: -slim para uma imagem menor

# Define o diretório de trabalho no container
WORKDIR /code

# Copia o arquivo de dependências primeiro para aproveitar o cache do Docker
COPY requirements.txt .

# Instala as dependências
# --no-cache-dir para reduzir o tamanho da imagem
# --default-timeout=100 para evitar timeouts em conexões lentas (opcional)
# RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código da aplicação para o diretório de trabalho
# Certifique-se de ter um .dockerignore para evitar copiar arquivos desnecessários
COPY . .

# Comando para executar a aplicação
# Para desenvolvimento: --reload permite que o servidor reinicie com alterações no código
# Para produção: remova --reload e considere mais workers se necessário com gunicorn, por exemplo.
# Ex: CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]