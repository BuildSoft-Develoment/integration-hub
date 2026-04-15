package com.integrationhub.platform.provider.reader;

import com.integrationhub.platform.spi.ReadBatch;
import com.integrationhub.platform.spi.ReadBatchConsumer;
import com.integrationhub.platform.spi.ReadRecord;
import com.integrationhub.platform.spi.ReadResult;
import com.integrationhub.platform.spi.ReaderProvider;
import com.integrationhub.platform.spi.SourcePayload;
import jakarta.enterprise.context.ApplicationScoped;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class XmlReaderProvider implements ReaderProvider {

    @Override
    public String type() {
        return "XML";
    }

    @Override
    public ReadResult readInBatches(SourcePayload payload,
                                    Map<String, Object> configuration,
                                    int batchSize,
                                    ReadBatchConsumer consumer) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            factory.setExpandEntityReferences(false);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);

            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document;
            try (var inputStream = payload.openStream()) {
                document = builder.parse(inputStream);
            }
            document.getDocumentElement().normalize();

            String recordElement = configuration.get("recordElement") == null
                    ? document.getDocumentElement().getTagName()
                    : String.valueOf(configuration.get("recordElement"));
            boolean includeAttributes = Boolean.parseBoolean(String.valueOf(configuration.getOrDefault("includeAttributes", true)));
            boolean trimValues = Boolean.parseBoolean(String.valueOf(configuration.getOrDefault("trimValues", true)));

            NodeList nodes = document.getElementsByTagName(recordElement);
            List<ReadRecord> records = new ArrayList<>();
            for (int i = 0; i < nodes.getLength(); i++) {
                Node node = nodes.item(i);
                if (node.getNodeType() != Node.ELEMENT_NODE) {
                    continue;
                }
                records.add(new ReadRecord(flattenElement((Element) node, includeAttributes, trimValues)));
            }
            emitBatches(payload.name(), records, batchSize, consumer);
            return new ReadResult(List.of(), records.size(), 0, List.of());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid XML payload", e);
        }
    }

    private void emitBatches(String fileName,
                             List<ReadRecord> records,
                             int batchSize,
                             ReadBatchConsumer consumer) {
        if (consumer == null || records.isEmpty()) {
            return;
        }
        var effectiveBatchSize = Math.max(batchSize, 1);
        var batchNumber = 1;
        for (var index = 0; index < records.size(); index += effectiveBatchSize) {
            var until = Math.min(records.size(), index + effectiveBatchSize);
            consumer.accept(new ReadBatch(fileName, batchNumber++, List.copyOf(new ArrayList<>(records.subList(index, until)))));
        }
    }

    private Map<String, Object> flattenElement(Element element, boolean includeAttributes, boolean trimValues) {
        Map<String, Object> values = new LinkedHashMap<>();

        if (includeAttributes) {
            NamedNodeMap attributes = element.getAttributes();
            for (int i = 0; i < attributes.getLength(); i++) {
                Node attribute = attributes.item(i);
                values.put("@" + attribute.getNodeName(), normalize(attribute.getNodeValue(), trimValues));
            }
        }

        NodeList childNodes = element.getChildNodes();
        boolean hasElementChildren = false;
        for (int i = 0; i < childNodes.getLength(); i++) {
            Node child = childNodes.item(i);
            if (child.getNodeType() == Node.ELEMENT_NODE) {
                hasElementChildren = true;
                Element childElement = (Element) child;
                values.put(childElement.getTagName(), normalize(childElement.getTextContent(), trimValues));
            }
        }

        if (!hasElementChildren) {
            values.put(element.getTagName(), normalize(element.getTextContent(), trimValues));
        }
        return values;
    }

    private String normalize(String value, boolean trimValues) {
        if (value == null) {
            return "";
        }
        return trimValues ? value.trim() : value;
    }
}
