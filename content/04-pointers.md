---
n: 04
title: მაჩვენებლები (Pointers)
en: Pointers
eyebrow: მეხსიერება
topics: მისამართი და მნიშვნელობა · & და * · -> · nullptr · ჩამოკიდებული მაჩვენებელი
---

ეს ყველაზე მნიშვნელოვანი თემაა. QGIS-ის API-ში ყოველ მეორე ფუნქციას აქვს `*` ან `->`: `QgsMapLayer *layer`, `layer->name()`.

## კურიერი და მისამართი

::: analogy კურიერი
კურიერს მძიმე ამანათი მოუვიდა. ის მას ადრესატთან კი არ მიაქვს, არამედ ეუბნება: „ამანათი ამ საწყობის ამ მისამართზეა“. მაჩვენებელი არის სწორედ **მისამართი**, არა თავად ამანათი. ბევრად იაფია მისამართის გადაცემა, ვიდრე მილიონობით წერტილიანი ფენის კოპირება.
:::

ორი სიმბოლო:

| სიმბოლო | სახელი | რას აკეთებს |
|---|---|---|
| `&x` | address-of | აბრუნებს `x`-ის მისამართს |
| `*p` | dereference | გადადის მისამართზე და კითხულობს მნიშვნელობას |

## პირველი მაჩვენებელი

```cpp ptr.cpp
#include <iostream>

int main() {
    int layerCount = 5;
    int *ptr = &layerCount;

    std::cout << "Layer count: " << layerCount << "\n";
    std::cout << "Address: " << ptr << "\n";
    std::cout << "Value at address: " << *ptr << "\n";
    return 0;
}
```

```output
Layer count: 5
Address: 0x7ffd5c3a1a24
Value at address: 5
```

::: note
მისამართი ყოველ გაშვებაზე და ყოველ კომპიუტერზე განსხვავებულია (Windows-ზე ის ასე გამოიყურება: `000000BF7C3BF970`). მნიშვნელობა კი ერთი და იგივეა.
:::

სამი ხაზი = სამი ფაქტი: **რა ძევს** (`5`), **სად ძევს** (მისამართი), **რას ვპოულობთ იქ** (`*ptr`).

## მაჩვენებელი ობიექტზე: ისარი

მაჩვენებელი ხშირად მიუთითებს მთელ ობიექტზე. წევრთან მისასვლელად წერტილის ნაცვლად `->` გამოიყენება.

```cpp layer_ptr.cpp
#include <iostream>
#include <string>

struct Layer {
    std::string name;
    int featureCount;
};

int main() {
    Layer rivers{"Rivers", 42};
    Layer *ptr = &rivers;

    std::cout << ptr->name << ": " << ptr->featureCount << "\n";

    ptr->featureCount += 8;                       // იგივეა, რაც (*ptr).featureCount += 8
    std::cout << rivers.featureCount << "\n";
    return 0;
}
```

```output
Rivers: 42
50
```

ხედავ? `ptr`-ით ცვლილება პირდაპირ `rivers`-ს შეეხო, რადგან ორივე ერთსა და იმავე ობიექტზე მიუთითებს, კოპირება არ მომხდარა.

::: tip წესი
ობიექტზე — `.` (`rivers.name`), მაჩვენებლით — `->` (`ptr->name`). ზუსტად ამიტომ გვაქვს QGIS-ში `layer->featureCount()`.
:::

## nullptr — „ფენა არ არის არჩეული“

მაჩვენებელი შეიძლება არაფერზე მიუთითებდეს. ამას `nullptr` ჰქვია.

```cpp nullptr.cpp
#include <iostream>
#include <string>

struct Layer {
    std::string name;
    int featureCount;
};

int main() {
    Layer *activeLayer = nullptr;

    if (activeLayer == nullptr) {
        std::cout << "No active layer\n";
    } else {
        std::cout << activeLayer->name << "\n";
    }
    return 0;
}
```

```output
No active layer
```

ეს QGIS-ის ყოველდღიური სიტუაციაა: `iface->activeLayer()` აბრუნებს `nullptr`-ს, თუ ფენა არ არის მონიშნული. PyQGIS-ში ეს `None` იყო.

::: compare
```python
layer = iface.activeLayer()
if layer is None:
    print("No active layer")
```

```cpp
QgsMapLayer *layer = iface->activeLayer();
if (layer == nullptr) {
  qDebug() << "No active layer";
}
```
:::

::: warn ხშირი შეცდომა
`nullptr`-ზე `->` გამოძახება პროგრამას ამსხვრევს (segmentation fault / crash). მაჩვენებელი ყოველთვის უნდა შეამოწმო `nullptr`-ზე, სანამ მას გამოიყენებ.
:::

## ჩამოკიდებული მაჩვენებელი

::: warn საშიში ადგილი
თუ ობიექტი აღარ არსებობს, მაჩვენებელი მაინც ინახავს ძველ მისამართს. ეს ჰგავს კურიერს, რომელიც მისამართზე მიდის, სადაც სახლი უკვე დაანგრიეს.
:::

```cpp dangling.cpp
int *makeCounter() {
    int count = 10;
    return &count;      // შეცდომა: count ფუნქციის დასრულებისას იშლება
}
```

`count` ლოკალური ცვლადია და ფუნქციის დასრულებისას იშლება. დაბრუნებული მისამართი უკვე არავის ეკუთვნის. ამის თავიდან ასაცილებლად არსებობს smart pointer-ები (თავი 08).

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. შექმენი `struct Parcel { std::string owner; double area; };`. გააკეთე მაჩვენებელი და `->`-ით გამოიტანე მფლობელი და ფართობი.
2. ფართობი გაზარდე 100 კვ.მ-ით მაჩვენებლის საშუალებით და შეამოწმე თავდაპირველ ობიექტში.
3. შექმენი `Parcel *p = nullptr;` და დაამატე შემოწმება, რომ პროგრამა არ დაიმსხვრეს.
:::

::: summary შეჯამება
- მაჩვენებელი ინახავს **მისამართს**; `&` მისამართს იღებს, `*` მნიშვნელობას კითხულობს.
- ობიექტზე მაჩვენებლით ვიყენებთ `->`-ს.
- `nullptr` = „არაფერზე მიუთითებს“; ყოველთვის შეამოწმე გამოყენებამდე.
- ლოკალური ცვლადის მისამართს ფუნქციიდან არ აბრუნებენ.
:::
