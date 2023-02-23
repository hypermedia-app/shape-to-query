FROM python:buster

RUN pip install bikeshed
RUN bikeshed update

ENTRYPOINT ["bikeshed"]
CMD ["--help"]
