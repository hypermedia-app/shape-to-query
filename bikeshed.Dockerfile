FROM python:buster

RUN pip install bikeshed==3.11.14
RUN bikeshed update

ENTRYPOINT ["bikeshed"]
CMD ["--help"]
