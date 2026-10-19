---
n: 08
title: მეხსიერების მართვა და smart pointers
en: Memory management and smart pointers
eyebrow: მეხსიერება
topics: stack და heap · new/delete · memory leak · unique_ptr · shared_ptr · QGIS-ის მფლობელობის წესები
---

პროგრამა მუშაობისას მეხსიერებას იკავებს: ცვლადებისთვის, ფენებისთვის, გეომეტრიებისთვის. როცა რაიმე აღარ გვჭირდება, ეს მეხსიერება უნდა გავათავისუფლოთ, თორემ პროგრამა თანდათან გაივსება და შეიძლება გაჩერდეს. ზოგ ენაში (მაგალითად, Python-ში) ამას ავტომატურად აკეთებს ე.წ. ნაგვის შემგროვებელი (garbage collector). C++-ში ეს ჩვენი პასუხისმგებლობაა. კარგი ამბავი ისაა, რომ თანამედროვე C++-ში ამას **smart pointer**-ები აკეთებენ.

## stack და heap

| | stack | heap |
|---|---|---|
| რა ინახება | ლოკალური ცვლადები | `new`-ით შექმნილი ობიექტები |
| ვინ ასუფთავებს | ავტომატურად, scope-ის დასრულებისას | პროგრამისტი (ან smart pointer) |
| სიჩქარე | ძალიან სწრაფი | ნელი |
| ზომა | შეზღუდული | დიდი |

::: analogy სასტუმრო და საკუთარი სახლი
stack სასტუმროა: ოთახი ავტომატურად გათავისუფლდება, როცა წახვალ. heap — საკუთარი ბინაა: შენ ვალდებული ხარ, დროზე დააბრუნო ან გაყიდო, თორემ სამუდამოდ დაკავებული დარჩება (memory leak).
:::

## new და delete

```cpp
Polygon *p = new Polygon("Parcel-1");   // heap-ზე შეიქმნა
// ... ვიყენებთ ...
delete p;                                // ხელით უნდა წავშალოთ
```

თუ `delete` დაგავიწყდა, მეხსიერება გაჟონავს (leak). თუ ორჯერ წაშალე ან წაშლის შემდეგ გამოიყენე, პროგრამა დაიმსხვრევა. ხელით `new`/`delete` თანამედროვე კოდში თითქმის აღარ იწერება.

## unique_ptr: ერთადერთი მფლობელი

**smart pointer** არის ობიექტი, რომელიც მაჩვენებელივით იქცევა, მაგრამ თავად ზრუნავს მეხსიერების გათავისუფლებაზე. `std::unique_ptr` ობიექტს ფლობს და **scope**-ის (ფიგურული ფრჩხილებით შემოსაზღვრული ბლოკის) დასრულებისას ავტომატურად წაშლის.

```cpp unique.cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Polygon {
    std::string name;
    explicit Polygon(std::string n) : name(std::move(n)) {
        std::cout << "created " << name << "\n";
    }
    ~Polygon() { std::cout << "destroyed " << name << "\n"; }
};

int main() {
    {
        auto p = std::make_unique<Polygon>("Parcel-1");
        std::cout << "using " << p->name << "\n";
    }
    std::cout << "after scope\n";
    return 0;
}
```

```output
created Parcel-1
using Parcel-1
destroyed Parcel-1
after scope
```

გავარჩიოთ:
- `Polygon` არის struct, რომელსაც აქვს **კონსტრუქტორი** (იბეჭდება „created“) და **დესტრუქტორი** `~Polygon()` (იბეჭდება „destroyed“). დესტრუქტორი ავტომატურად სრულდება, როცა ობიექტი ქრება;
- `std::make_unique<Polygon>("Parcel-1")` ქმნის `Polygon`-ს heap-ზე და აბრუნებს `unique_ptr`-ს. კუთხური ფრჩხილები ტიპს უთითებს: რის მაჩვენებელია;
- `p->name` — წევრთან მისვლა, როგორც ჩვეულებრივ მაჩვენებელთან;
- ბლოკი `{ ... }` იქმნება მხოლოდ იმისთვის, რომ მისი დასასრული „ჩანდეს“: `p` იქ ქრება და ობიექტიც მაშინვე იშლება.

`delete` არსად დაგვიწერია, მაგრამ ობიექტი ზუსტად ბლოკის ბოლოს განადგურდა. ამ პრინციპს RAII ჰქვია: რესურსი ობიექტის სიცოცხლეს ებმება.

## მფლობელობის გადაცემა: std::move

`unique_ptr`-ის კოპირება შეუძლებელია, რადგან მფლობელი ერთია. შეიძლება მხოლოდ **გადაცემა**. ამას `std::move` აკეთებს: „გადაეცი მფლობელობა“ (მანამდე ბევრგან დაწერილი `std::move(name)` ზუსტად ასეა: ტექსტს ახალ ადგილზე გადააქვს, კოპირების გარეშე).

```cpp
auto a = std::make_unique<Polygon>("Parcel-2");
auto b = std::move(a);          // ახლა b ფლობს, a ცარიელია

if (a == nullptr) {
    std::cout << "a is empty\n";
}
```

```output
created Parcel-2
a is empty
destroyed Parcel-2
```

ბოლო ხაზი პროგრამის დასრულებისას ჩნდება, როცა `b` იშლება.

::: tip QGIS-ში
`std::unique_ptr<QgsAbstractGeometry>` ხშირად გვხვდება: ფუნქცია, რომელიც ახალ გეომეტრიას ქმნის, მის მფლობელობას გვიბრუნებს. ჩანაწერი `std::unique_ptr<...>` ხელმოწერაში ნიშნავს „ეს შენია, შენ უნდა მართო“.
:::

## shared_ptr: ბევრი მფლობელი

როცა ერთ ობიექტს რამდენიმე ადგილი იყენებს, გამოიყენება `std::shared_ptr`. ობიექტი წაიშლება მაშინ, როცა ბოლო მფლობელიც გაქრება (reference counting).

```cpp shared.cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

struct Polygon {
    std::string name;
    explicit Polygon(std::string n) : name(std::move(n)) {
        std::cout << "created " << name << "\n";
    }
    ~Polygon() { std::cout << "destroyed " << name << "\n"; }
};

int main() {
    auto a = std::make_shared<Polygon>("Shared");
    std::cout << a.use_count() << "\n";
    {
        auto b = a;
        std::cout << a.use_count() << "\n";
    }
    std::cout << a.use_count() << "\n";
    return 0;
}
```

```output
created Shared
1
2
1
destroyed Shared
```

`use_count()` გვეუბნება, ამჟამად რამდენი მფლობელი ჰყავს ობიექტს. `auto b = a;` ქმნის მეორე მფლობელს, ამიტომ რიცხვი 2 ხდება. შიდა ბლოკის დასრულებისას `b` ქრება და რიცხვი ისევ 1-ია. ობიექტი მხოლოდ მაშინ წაიშლება, როცა ბოლო მფლობელიც წავა (`main`-ის ბოლოს).

## რა ხდება QGIS-ში

QGIS-ს საკუთარი მფლობელობის წესები აქვს და დოკუმენტაცია მათ განმარტავს:

| სიტუაცია | წესი |
|---|---|
| `QgsProject::addMapLayer(layer)` | პროექტი იღებს ფენის მფლობელობას და თვითონ წაშლის |
| Qt-ის `QObject` ხე | მშობელი შვილებს თავად წაშლის (იხ. თავი 10) |
| `std::unique_ptr<T>` დაბრუნება | მიმღები მფლობელია |
| მაჩვენებელი `T *` ხელმოწერაში | ჩვეულებრივ მფლობელობა არ გადადის |

::: warn ყურადღება
თუ ფენას `new QgsVectorLayer(...)`-ით ქმნი და პროექტს აძლევ, თავად `delete` აღარ დაწერო. ფენა პროექტის საკუთრებაა და ორმაგი წაშლა პროგრამას დაამსხვრევს.
:::

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. გადააკეთე თავი 04-ის `Layer rivers{...}` მაგალითი `std::make_unique<Layer>(...)`-ზე.
2. შექმენი `std::vector<std::unique_ptr<Polygon>>` და ჩაამატე სამი მრავალკუთხედი (`push_back(std::make_unique<...>(...))`). რა თანმიმდევრობით წაიშლებიან?
3. შეეცადე `unique_ptr`-ის კოპირებას (`auto b = a;`) და წაიკითხე შეცდომა.
:::

::: summary შეჯამება
- stack ავტომატურია, heap — მფლობელის პასუხისმგებლობა.
- ხელით `new`/`delete` თავიდან აიცილე, გამოიყენე `make_unique` / `make_shared`.
- `unique_ptr` = ერთი მფლობელი, `shared_ptr` = ბევრი.
- QGIS-ში ყოველთვის გაარკვიე, ვინ ფლობს ობიექტს.
:::
