# Aperium: Modern Paket Yöneticisi.

Aperium, Aperture Labs Ekosisteminin bir ürünüdür.

Aperium, sadece bir paket yükleyicisi değil, aynı zamanda geliştirdiğiniz ve paylaştığınız özel paketlerinizi de kolayca yönetebileceğiniz bir araçtır. Node.js ekosisteminde paket yükleme sürecini daha verimli, sade ve kullanıcı dostu hale getirmek için tasarlanmış bu araç, geliştiricilere hız kazandırır. Hem dışa bağımlı paketleri (npm üzerinden indirilen paketler) hem de kendi özel paketlerinizi indirmenize olanak tanır. Aperium ile yalnızca popüler açık kaynaklı paketleri değil, kendi projelerinizin modüllerini de sorunsuzca yükleyebilirsiniz.

Aperium'a paket yüklemek için github repomuzdan çekme isteği olușturarak projenizi ekleyebilirsiniz.

## Projenin Temel Özellikleri:

Aperium, yalnızca npm üzerindeki paketleri yüklemekle kalmaz, aynı zamanda kendi özel paketlerinizi de indirip projelere dahil etmenizi sağlar. aper komutu ile geliştirdiğiniz modülleri veya paylaşmak istediğiniz projeleri başkalarına yükleyebilirsiniz.

## Aperium’un Kullanımı:

Aperium, iki ana komutla çalışır: naper ve aper. Bu komutlar farklı işlevleri yerine getirir.

```bash
naper install <paketAdı>
```


Bu komut, dışa bağımlı paketleri npm üzerinden indirir. express, lodash gibi popüler paketleri yüklerken bu komutu kullanabilirsiniz.

```bash
naper install express
```

Bu komut çalıştırıldığında, sadece gerekli çıktılar gösterilecek ve gereksiz bilgiler gizlenecektir. Yükleme işlemi tamamlandıktan sonra, kullanıcıya başarı mesajı gösterilir:

```bash
🔍 express paketi indiriliyor... ✅ express başarıyla indirildi.
```
<hr>
Aper

Aperium’un en güçlü özelliklerinden biri, kullanıcıların kendi geliştirdiği özel paketleri yükleyebilmesidir. aper komutu, sadece dışa bağımlı paketleri değil, aynı zamanda sizin geliştirdiğiniz ve paylaştığınız modülleri de projeye dahil etmenizi sağlar.

```bash
aper install <paketAdı>
```
