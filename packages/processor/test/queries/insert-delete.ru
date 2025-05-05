base <http://example.org/>

INSERT DATA {
    GRAPH <urn:example:graph> {
        <airport> a <urn:example:Airport> ;
    }
};

INSERT {
    ?airport a <urn:example:Airport> ;
}
WHERE {
    GRAPH <urn:example:graph> {
        ?airport a <urn:example:Airport> ;
    }
};

DELETE {
    GRAPH <urn:example:graph> {
        ?airport a <urn:example:Airport> ;
    }
}
WHERE {
    GRAPH <urn:example:graph> {
        ?airport a <urn:example:Airport> ;
    }
}
